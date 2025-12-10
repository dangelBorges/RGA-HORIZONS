import React from 'react';
import { Moon, Sun, BarChart3 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              {/* Título Principal Traducido */}
              <h1 className="text-xl font-bold text-foreground">Análisis Corporativo</h1>
              {/* Subtítulo Traducido */}
              <p className="text-sm text-muted-foreground">Inteligencia de Negocios en Tiempo Real</p>
            </div>
          </div>
          
          {/* Botón de Tema (Oscuro/Claro) - Sin traducción necesaria en la lógica */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="relative overflow-hidden group"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;