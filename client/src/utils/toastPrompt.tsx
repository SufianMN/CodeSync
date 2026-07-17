import { toast, Toast, ToastPosition } from 'react-hot-toast';
import { FormEvent } from 'react';

export const toastPrompt = (
  message: string,
  defaultValue: string = '',
  position: ToastPosition = 'top-center',
): Promise<string | null> => {
  return new Promise((resolve) => {
    toast.custom(
      (t: Toast) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-gray-900 shadow-lg rounded-lg pointer-events-auto flex flex-col border border-gray-800`}
        >
          <div className="p-4 flex-1">
            <p className="text-sm font-medium text-white mb-3">{message}</p>
            <form
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const val = formData.get('inputVal') as string;
                toast.dismiss(t.id);
                resolve(val);
              }}
            >
              <input
                autoFocus
                name="inputVal"
                defaultValue={defaultValue}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(null);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
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
