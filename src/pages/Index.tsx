import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page as main entry point
    navigate('/login');
  }, [navigate]);

  return null;
};

export default Index;
