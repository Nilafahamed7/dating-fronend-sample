import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ to, onClick, className = '' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors ${className}`}
    >
      <ArrowLeftIcon className="w-5 h-5" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}

