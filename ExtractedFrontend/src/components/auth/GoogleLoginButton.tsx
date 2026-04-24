import React from 'react';

interface GoogleLoginButtonProps {
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onClick, loading, disabled = false }) => {
    const isDisabled = loading || disabled;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className="w-full py-3.5 px-4 rounded-xl border border-white/15 bg-white text-surface-900 hover:bg-surface-100 transition-colors flex items-center justify-center gap-3 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label="Continue with Google"
        >
            {loading ? (
                <div className="h-5 w-5 border-2 border-surface-300 border-t-surface-700 rounded-full animate-spin" />
            ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.6C16.8 2.7 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.5S6.9 21 12 21c6.9 0 9.1-4.9 9.1-7.4 0-.5 0-.9-.1-1.3H12Z"
                    />
                </svg>
            )}
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>
    );
};

export default GoogleLoginButton;
