import { X } from "lucide-react";
import { IconBtn } from "./Buttons";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export function Modal({ title, onClose, children, width = 480, footer }: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-card rounded-[18px] border border-card-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ width: Math.min(width, 640), maxWidth: "100%" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <IconBtn icon={X} onClick={onClose} />
          </div>
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
            {children}
          </div>
          {footer && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
