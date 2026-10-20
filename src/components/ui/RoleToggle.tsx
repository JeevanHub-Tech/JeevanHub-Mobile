// src/components/ui/RoleToggle.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stethoscope, User } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { UserRole } from '../../types/auth';

interface RoleToggleProps {
  selectedRole: UserRole;
  onSelectRole: (role: 'patient' | 'doctor') => void;
}

export const RoleToggle: React.FC<RoleToggleProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectRole('patient')}
        style={[
          styles.tab,
          selectedRole === 'patient' && styles.tabActive,
        ]}
      >
        <User
          size={18}
          color={selectedRole === 'patient' ? Colors.cream : Colors.oliveDeep}
        />
        <Text
          style={[
            styles.tabText,
            selectedRole === 'patient' && styles.tabTextActive,
          ]}
        >
          Patient
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectRole('doctor')}
        style={[
          styles.tab,
          selectedRole === 'doctor' && styles.tabActive,
        ]}
      >
        <Stethoscope
          size={18}
          color={selectedRole === 'doctor' ? Colors.cream : Colors.oliveDeep}
        />
        <Text
          style={[
            styles.tabText,
            selectedRole === 'doctor' && styles.tabTextActive,
          ]}
        >
          Doctor
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.sagePale,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.oliveAction,
    shadowColor: Colors.oliveDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  tabTextActive: {
    color: Colors.cream,
    fontWeight: '700',
  },
});
