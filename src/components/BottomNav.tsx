import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
}

export function BottomNav({ items, activeId }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, activeId === item.id ? styles.active : styles.inactive]}
          onPress={item.onClick}
          activeOpacity={0.7}
          accessibilityLabel={item.label}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeId === item.id }}
        >
          <Text style={[styles.icon, activeId === item.id ? styles.iconActive : styles.iconInactive]}>
            {item.icon}
          </Text>
          <Text style={[styles.label, activeId === item.id ? styles.labelActive : styles.labelInactive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  active: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  inactive: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconActive: {
    color: '#6366f1',
  },
  iconInactive: {
    color: '#64748b',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelActive: {
    color: '#6366f1',
  },
  labelInactive: {
    color: '#64748b',
  },
});
