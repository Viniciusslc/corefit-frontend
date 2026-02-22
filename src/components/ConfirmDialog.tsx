'use client';

import React from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title = 'Confirmar ação',
  description = 'Tem certeza?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        onClick={() => !loading && onClose()}
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            className={`rounded-xl px-4 py-2 text-sm text-white disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
