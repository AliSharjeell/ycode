/**
 * Native application menu.
 *
 * The renderer subscribes to menu actions via window.api.on.menuAction.
 * Keeping the menu in the main process means the same shortcuts work
 * whether or not the editor has focus.
 */
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

const isMac = process.platform === 'darwin';

export function buildAppMenu(win: BrowserWindow): void {
  const send = (action: string) => {
    if (!win.isDestroyed()) {
      win.webContents.send('menu:action', action);
    }
  };

  const fileSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'New Project…',
      accelerator: 'CmdOrCtrl+N',
      click: () => send('project:create'),
    },
    {
      label: 'Open Project…',
      accelerator: 'CmdOrCtrl+O',
      click: () => send('project:open'),
    },
    {
      label: 'Open Recent',
      submenu: [
        { label: 'No recent projects', enabled: false },
      ],
    },
    { type: 'separator' },
    {
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click: () => send('project:save'),
    },
    {
      label: 'Close Project',
      accelerator: 'CmdOrCtrl+W',
      click: () => send('project:close'),
    },
    { type: 'separator' },
    {
      label: 'Commit…',
      accelerator: 'CmdOrCtrl+Shift+C',
      click: () => send('git:commit'),
    },
    {
      label: 'Push',
      accelerator: 'CmdOrCtrl+Shift+P',
      click: () => send('git:push'),
    },
    {
      label: 'Pull',
      accelerator: 'CmdOrCtrl+Shift+U',
      click: () => send('git:pull'),
    },
    { type: 'separator' },
    {
      label: 'Build Site',
      accelerator: 'CmdOrCtrl+B',
      click: () => send('builder:build'),
    },
    {
      label: 'Preview',
      accelerator: 'CmdOrCtrl+Shift+B',
      click: () => send('builder:preview'),
    },
    { type: 'separator' },
    isMac ? { role: 'close' } : { role: 'quit' },
  ];

  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    ...(isMac
      ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
        ]
      : [{ role: 'delete' as const }, { role: 'selectAll' as const }]),
  ];

  const viewSubmenu: MenuItemConstructorOptions[] = [
    { role: 'reload' },
    { role: 'forceReload' },
    { role: 'toggleDevTools' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' },
  ];

  const gitSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Status',
      click: () => send('git:status'),
    },
    {
      label: 'History',
      click: () => send('git:log'),
    },
    { type: 'separator' },
    {
      label: 'Branches',
      click: () => send('git:branches'),
    },
    {
      label: 'Connect GitHub…',
      click: () => send('github:connect'),
    },
  ];

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    { label: 'File', submenu: fileSubmenu },
    { label: 'Edit', submenu: editSubmenu },
    { label: 'View', submenu: viewSubmenu },
    { label: 'Git', submenu: gitSubmenu },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Ycode',
          click: () => send('app:about'),
        },
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://docs.ycode.com'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/ycode/ycode/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
