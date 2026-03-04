import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Car, Zap } from 'lucide-react';
import api from '../services/api';
import type { VehicleType } from '../types';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <h1 className="text-5xl font-bold text-white">Vehicle Rental System</h1>
    </div>
  );
};

export default HomePage;
