// src/components/common/DeleteConfirmModal.jsx
import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  itemType = 'Blueprint',
  isDeleting = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title={`Delete ${itemType}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-rose-200">
              This action cannot be undone.
            </p>
            <p>
              Are you sure you want to delete{' '}
              <strong className="text-white font-semibold break-words">
                &ldquo;{itemTitle}&rdquo;
              </strong>
              ? All associated milestones, checklists, and progress will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1e293b]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary text-xs py-2 px-4 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 shadow-sm"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" />
                <span>Deleting…</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete {itemType}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
