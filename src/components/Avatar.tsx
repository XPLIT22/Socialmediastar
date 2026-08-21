import { avatarColor, initials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  id: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-28 h-28 text-3xl',
};

export default function Avatar({ name, id, url, size = 'md' }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} ${avatarColor(
        id
      )} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}
    >
      {initials(name)}
    </div>
  );
}
