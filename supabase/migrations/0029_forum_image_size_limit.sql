-- Originals up to 5MB are processed by the app; stored files must be <= 2MB.
update storage.buckets set file_size_limit = 2097152 where id = 'forum-images';
