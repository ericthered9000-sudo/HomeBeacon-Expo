package com.homebeacon.app.billing

import android.app.Activity
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryProductDetailsResult
import com.android.billingclient.api.QueryPurchasesParams
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

private const val EVENT_PURCHASES_UPDATED = "onPurchasesUpdated"
private const val BILLING_NOT_INITIALIZED = "BILLING_NOT_INITIALIZED"
private const val BILLING_SETUP_FAILED = "BILLING_SETUP_FAILED"
private const val BILLING_FLOW_FAILED = "BILLING_FLOW_FAILED"
private const val NO_CURRENT_ACTIVITY = "NO_CURRENT_ACTIVITY"

/**
 * React Native bridge for Google Play Billing Library 8.x.
 *
 * Exposes a stable JavaScript API used by src/lib/googlePlayBilling.ts.
 * The module is intentionally focused on subscription purchases because
 * HomeBeacon only sells subscription tiers.
 */
class GooglePlayBillingModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), PurchasesUpdatedListener {

  private var billingClient: BillingClient? = null
  private var isConnected: Boolean = false
  private var pendingConnectionPromises: MutableList<Promise> = mutableListOf()

  override fun getName(): String = "GooglePlayBilling"

  // NativeEventEmitter contract requires these no-op stubs; events are emitted
  // directly via RCTDeviceEventEmitter from emitEvent().
  @ReactMethod
  fun addListener(type: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}

  override fun onCatalystInstanceDestroy() {
    endConnectionInternal()
    super.onCatalystInstanceDestroy()
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
    val event = Arguments.createMap().apply {
      putInt("responseCode", result.responseCode)
      result.debugMessage?.let { putString("debugMessage", it) }
      putArray("purchases", purchases?.let { buildPurchasesArray(it) } ?: Arguments.createArray())
    }
    emitEvent(EVENT_PURCHASES_UPDATED, event)
  }

  @ReactMethod
  fun initialize(promise: Promise) {
    if (billingClient?.isReady == true) {
      promise.resolve(true)
      return
    }

    endConnectionInternal()

    val activity = getCurrentActivity()
    if (activity == null || activity.isFinishing) {
      promise.reject(NO_CURRENT_ACTIVITY, "No active Activity available for billing")
      return
    }

    val pendingPurchasesParams = PendingPurchasesParams.newBuilder()
      .enableOneTimeProducts()
      .build()

    val client = BillingClient.newBuilder(activity)
      .setListener(this)
      .enablePendingPurchases(pendingPurchasesParams)
      .build()

    billingClient = client
    pendingConnectionPromises.add(promise)

    client.startConnection(object : BillingClientStateListener {
      override fun onBillingSetupFinished(result: BillingResult) {
        isConnected = result.responseCode == BillingClient.BillingResponseCode.OK
        if (isConnected) {
          resolvePendingConnectionPromises(true)
        } else {
          val message = result.debugMessage ?: "Billing setup failed with code ${result.responseCode}"
          rejectPendingConnectionPromises(BILLING_SETUP_FAILED, message)
          endConnectionInternal()
        }
      }

      override fun onBillingServiceDisconnected() {
        isConnected = false
      }
    })
  }

  @ReactMethod
  fun getProducts(productIds: ReadableArray, promise: Promise) {
    executeWhenConnected(promise) {
      val params = QueryProductDetailsParams.newBuilder()
        .setProductList(
          productIds.toArrayList().filterIsInstance<String>().map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
              .setProductId(productId)
              .setProductType(BillingClient.ProductType.SUBS)
              .build()
          }
        )
        .build()

      billingClient?.queryProductDetailsAsync(params) { result, detailsResult ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(buildProductsArray(detailsResult.productDetailsList ?: emptyList()))
        } else {
          promise.reject(
            "QUERY_PRODUCTS_FAILED",
            result.debugMessage ?: "Failed to query products (code ${result.responseCode})"
          )
        }
      }
    }
  }

  @ReactMethod
  fun purchase(
    productId: String,
    basePlanId: String?,
    offerToken: String?,
    promise: Promise
  ) {
    executeWhenConnected(promise) {
      val params = QueryProductDetailsParams.newBuilder()
        .setProductList(
          listOf(
            QueryProductDetailsParams.Product.newBuilder()
              .setProductId(productId)
              .setProductType(BillingClient.ProductType.SUBS)
              .build()
          )
        )
        .build()

      billingClient?.queryProductDetailsAsync(params) { result, detailsResult ->
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
          promise.reject(
            "QUERY_PRODUCTS_FAILED",
            result.debugMessage ?: "Failed to query product details (code ${result.responseCode})"
          )
          return@queryProductDetailsAsync
        }

        val productDetails = detailsResult.productDetailsList?.firstOrNull { it.productId == productId }
        if (productDetails == null) {
          promise.reject("PRODUCT_NOT_FOUND", "Product $productId not found in Play Console")
          return@queryProductDetailsAsync
        }

        val offer = selectOffer(productDetails, basePlanId, offerToken)
        val token = offer?.offerToken
        if (token == null && productDetails.subscriptionOfferDetails?.isNotEmpty() == true) {
          promise.reject("OFFER_NOT_FOUND", "No matching offer token for $productId")
          return@queryProductDetailsAsync
        }

        val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
          .setProductDetails(productDetails)
          .apply { token?.let { setOfferToken(it) } }
          .build()

        val flowParams = BillingFlowParams.newBuilder()
          .setProductDetailsParamsList(listOf(productDetailsParams))
          .build()

        val activity = getCurrentActivity()
        if (activity == null || activity.isFinishing) {
          promise.reject(NO_CURRENT_ACTIVITY, "No active Activity available for billing flow")
          return@queryProductDetailsAsync
        }

        val flowResult = billingClient?.launchBillingFlow(activity, flowParams)
        if (flowResult?.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(true)
        } else {
          promise.reject(
            BILLING_FLOW_FAILED,
            flowResult?.debugMessage ?: "Failed to launch billing flow"
          )
        }
      }
    }
  }

  @ReactMethod
  fun restorePurchases(promise: Promise) {
    executeWhenConnected(promise) {
      billingClient?.queryPurchasesAsync(
        QueryPurchasesParams.newBuilder()
          .setProductType(BillingClient.ProductType.SUBS)
          .build()
      ) { result, purchases ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(buildPurchasesArray(purchases ?: emptyList()))
        } else {
          promise.reject(
            "RESTORE_FAILED",
            result.debugMessage ?: "Failed to restore purchases (code ${result.responseCode})"
          )
        }
      }
    }
  }

  @ReactMethod
  fun getActivePurchases(promise: Promise) {
    executeWhenConnected(promise) {
      billingClient?.queryPurchasesAsync(
        QueryPurchasesParams.newBuilder()
          .setProductType(BillingClient.ProductType.SUBS)
          .build()
      ) { result, purchases ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(buildPurchasesArray(purchases ?: emptyList()))
        } else {
          promise.reject(
            "QUERY_PURCHASES_FAILED",
            result.debugMessage ?: "Failed to query active purchases (code ${result.responseCode})"
          )
        }
      }
    }
  }

  @ReactMethod
  fun acknowledgePurchase(purchaseToken: String, promise: Promise) {
    executeWhenConnected(promise) {
      val params = AcknowledgePurchaseParams.newBuilder()
        .setPurchaseToken(purchaseToken)
        .build()

      billingClient?.acknowledgePurchase(params) { result ->
        if (result.responseCode == BillingClient.BillingResponseCode.OK) {
          promise.resolve(true)
        } else {
          promise.reject(
            "ACKNOWLEDGE_FAILED",
            result.debugMessage ?: "Failed to acknowledge purchase (code ${result.responseCode})"
          )
        }
      }
    }
  }

  private fun selectOffer(
    productDetails: ProductDetails,
    basePlanId: String?,
    offerToken: String?
  ): ProductDetails.SubscriptionOfferDetails? {
    val offers = productDetails.subscriptionOfferDetails ?: return null

    if (!offerToken.isNullOrEmpty()) {
      offers.firstOrNull { it.offerToken == offerToken }?.let { return it }
    }

    if (!basePlanId.isNullOrEmpty()) {
      offers.firstOrNull { it.basePlanId == basePlanId }?.let { return it }
    }

    return offers.firstOrNull()
  }

  private fun executeWhenConnected(promise: Promise, block: () -> Unit) {
    if (isConnected && billingClient?.isReady == true) {
      block()
      return
    }
    promise.reject(BILLING_NOT_INITIALIZED, "Billing client not initialized. Call initializeBilling() first.")
  }

  private fun resolvePendingConnectionPromises(value: Boolean) {
    val copy = pendingConnectionPromises.toList()
    pendingConnectionPromises.clear()
    copy.forEach { it.resolve(value) }
  }

  private fun rejectPendingConnectionPromises(code: String, message: String) {
    val copy = pendingConnectionPromises.toList()
    pendingConnectionPromises.clear()
    copy.forEach { it.reject(code, message) }
  }

  private fun endConnectionInternal() {
    isConnected = false
    billingClient?.endConnection()
    billingClient = null
  }

  private fun emitEvent(eventName: String, params: WritableMap) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, params)
  }

  private fun buildProductsArray(products: List<ProductDetails>): WritableArray {
    return Arguments.createArray().apply {
      products.forEach { product ->
        pushMap(buildProductMap(product))
      }
    }
  }

  private fun buildProductMap(product: ProductDetails): WritableMap {
    return Arguments.createMap().apply {
      putString("productId", product.productId)
      putString("name", product.name)
      putString("description", product.description)
      putString("type", product.productType)
      putArray("subscriptionOfferDetails", buildOffersArray(product.subscriptionOfferDetails ?: emptyList()))
    }
  }

  private fun buildOffersArray(offers: List<ProductDetails.SubscriptionOfferDetails>): WritableArray {
    return Arguments.createArray().apply {
      offers.forEach { offer ->
        pushMap(Arguments.createMap().apply {
          putString("offerToken", offer.offerToken)
          putString("basePlanId", offer.basePlanId)
          offer.offerId?.let { putString("offerId", it) }
          putArray("pricingPhases", buildPricingPhasesArray(offer.pricingPhases))
        })
      }
    }
  }

  private fun buildPricingPhasesArray(pricingPhases: ProductDetails.PricingPhases): WritableArray {
    return Arguments.createArray().apply {
      pricingPhases.pricingPhaseList.forEach { phase ->
        pushMap(Arguments.createMap().apply {
          putString("formattedPrice", phase.formattedPrice)
          putString("priceCurrencyCode", phase.priceCurrencyCode)
          putInt("billingCycleCount", phase.billingCycleCount)
          putString("billingPeriod", phase.billingPeriod)
          putInt("recurrenceMode", phase.recurrenceMode)
        })
      }
    }
  }

  private fun buildPurchasesArray(purchases: List<Purchase>): WritableArray {
    return Arguments.createArray().apply {
      purchases.forEach { purchase ->
        pushMap(buildPurchaseMap(purchase))
      }
    }
  }

  private fun buildPurchaseMap(purchase: Purchase): WritableMap {
    return Arguments.createMap().apply {
      putString("orderId", purchase.orderId)
      putString("purchaseToken", purchase.purchaseToken)
      putString("productId", purchase.products.firstOrNull())
      putArray("productIds", Arguments.fromArray(purchase.products.toTypedArray()))
      putString("packageName", purchase.packageName)
      putDouble("purchaseTime", purchase.purchaseTime.toDouble())
      putBoolean("isAcknowledged", purchase.isAcknowledged)
      putBoolean("isAutoRenewing", purchase.isAutoRenewing)
      putInt("purchaseState", purchase.purchaseState)
    }
  }
}
