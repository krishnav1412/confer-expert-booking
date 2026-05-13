import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { uploadAvatar } from '../api/upload';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

const AvatarUploader = ({ size = 'xl' }) => {
  const { user, refreshUser } = useAuth();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const mutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async () => {
      await refreshUser();
      setPreview(null);
      toast.success('Profile photo updated');
    },
    onError: (err) => {
      setPreview(null);
      toast.error(err?.message || 'Upload failed');
    },
  });

  const onFile = (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('File is larger than 5MB');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Use PNG, JPEG, WebP, or GIF');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    mutation.mutate(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar src={preview || user?.avatar} name={user?.name} size={size} />
        {mutation.isPending && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={mutation.isPending}
          className="btn-secondary text-sm">
          {mutation.isPending ? 'Uploading…' : user?.avatar ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
          PNG, JPEG, WebP, GIF · max 5MB
        </p>
      </div>
    </div>
  );
};

export default AvatarUploader;
