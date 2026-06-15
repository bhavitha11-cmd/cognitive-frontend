import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * AddClientPage — redirects to /clients.
 * Client creation is handled via the modal on ClientListPage.
 */
export const AddClientPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/clients', { replace: true });
  }, [navigate]);

  return null;
};

export default AddClientPage;
