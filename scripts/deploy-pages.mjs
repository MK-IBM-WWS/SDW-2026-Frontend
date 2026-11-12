import ghpages from 'gh-pages';
import { buildPages } from './build-pages.mjs';
// Имя репозитория определяется из git remote origin. Выкладывается только dist-pages.
buildPages(process.argv[2]);
ghpages.publish('dist-pages', { dotfiles: true }, (error) => {
  if (error) { console.error(error.message); process.exitCode = 1; }
  else console.log('Сборка отправлена в gh-pages. Выберите эту ветку в Settings → Pages.');
});
