import { motion } from 'framer-motion';

export default function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  action // Support for custom action element
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      {Icon && (
        <motion.div
          className="mb-4 text-velora-primary"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon className="w-16 h-16" />
          </motion.div>
        </motion.div>
      )}
      <motion.h3
        className="text-xl font-bold text-velora-darkGray mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-gray-600 text-center mb-6 max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.p>
      {action ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {action}
        </motion.div>
      ) : actionLabel && onAction ? (
        <motion.button
          onClick={onAction}
          className="btn-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}
          whileTap={{ scale: 0.95 }}
        >
          {actionLabel}
        </motion.button>
      ) : null}
    </motion.div>
  );
}

