import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ label, onClose, className, children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(ev) => {
        ev.preventDefault();
        onClose();
      }}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
      className={className}
      {...props}
    >
      {children}
    </dialog>,
    document.body
  );
}
