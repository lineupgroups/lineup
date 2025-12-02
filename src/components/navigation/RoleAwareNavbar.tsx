import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SupporterNavbar from './SupporterNavbar';
import CreatorNavbar from './CreatorNavbar';

export default function RoleAwareNavbar() {
  const { currentMode } = useAuth();

  return currentMode === 'creator' ? <CreatorNavbar /> : <SupporterNavbar />;
}
