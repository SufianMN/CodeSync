import { toast, Toast, ToastPosition } from 'react-hot-toast';
import { FormEvent, useState } from 'react';

interface PromptProps {
  t: Toast;
  message: string;
  defaultValue: string;
  resolve: (val: string | null) => void;
  onConfirm?: (val: string) => Promise<void>;
}

const PromptComponent = ({ t, message, defaultValue, resolve, onConfirm }: PromptProps) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const val = formData.get('inputVal') as string;

    if (onConfirm) {
      setLoading(true);
      setError('');
      try {
        await onConfirm(val);
        toast.dismiss(t.id);
        resolve(val);
      } catch (err: any) {
        let errorMsg = 'An error occurred';
        if (err.response?.data?.error?.message) {
          errorMsg = err.response.data.error.message;
        } else if (err.message) {
          errorMsg = err.message;
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      toast.dismiss(t.id);
      resolve(val);
    }
  };

  return (
    <div
      className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-800`}
    >
      <div className="p-4 flex-1">
        <p className="text-sm font-medium text-white mb-3">{message}</p>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            name="inputVal"
            defaultValue={defaultValue}
            disabled={loading}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(null);
              }}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const toastPrompt = (
  message: string,
  defaultValue: string = '',
  position: ToastPosition = 'top-center',
  onConfirm?: (val: string) => Promise<void>,
): Promise<string | null> => {
  return new Promise((resolve) => {
    toast.custom(
      (t: Toast) => (
        <PromptComponent
          t={t}
          message={message}
          defaultValue={defaultValue}
          resolve={resolve}
          onConfirm={onConfirm}
        />
      ),
      { duration: Infinity, position },
    );
  });
};

export const toastConfirm = (
  message: string,
  position: ToastPosition = 'top-center',
): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom(
      (t: Toast) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-800`}
        >
          <div className="p-4 flex-1">
            <p className="text-sm font-medium text-white mb-4">{message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity, position },
    );
  });
};
