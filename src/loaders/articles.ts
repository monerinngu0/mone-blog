import { existsSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob, type Loader } from 'astro/loaders';

/** Folder names are stable article IDs, regardless of their grouping folders. */
export function articleFolders(): Loader {
  return {
    name: 'article-folders',
    async load(context) {
      // Reset on each sync, while retaining the map for glob's dev watcher.
      const pathsById = new Map<string, string>();
      const loader = glob({
        base: './content/articles',
        pattern: '**/index.mdx',
        generateId({ entry, base }) {
          const id = basename(dirname(entry));
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
            throw new Error(`Invalid article folder "${entry}". Use a folder name with lowercase letters, digits and hyphens.`);
          }

          const filePath = resolve(fileURLToPath(base), entry);
          const previousPath = pathsById.get(id);
          // Check before glob's digest cache: identical files must also fail.
          if (previousPath && previousPath !== filePath && existsSync(previousPath)) {
            throw new Error(`Duplicate article ID "${id}": ${previousPath} and ${filePath}. Article folder names must be unique, including drafts.`);
          }
          pathsById.set(id, filePath);

          // A move can preserve both ID and contents. Invalidate the old path so
          // Astro renders the new file and resolves its colocated assets there.
          const stored = context.store.get(id);
          const projectPath = relative(fileURLToPath(context.config.root), filePath).split('\\').join('/');
          if (stored?.filePath && stored.filePath !== projectPath) {
            context.store.delete(id);
          }
          return id;
        },
      });
      await loader.load(context);
    },
  };
}
