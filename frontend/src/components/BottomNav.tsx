import { NavLink, useLocation } from 'react-router-dom';
import { Compass, PlusCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/community', icon: Compass, label: '广场' },
  { path: '/', icon: PlusCircle, label: '创作' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function BottomNav() {
  const location = useLocation();
  // 阅读器页面隐藏底部导航
  if (location.pathname.startsWith('/reader/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                isActive ? 'text-accent' : 'text-text-tertiary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
