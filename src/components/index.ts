export { Fallback, type FallbackProps } from './fallback';
export { JsonPreview } from './json-preview';
export { Loading, registerLoadingDirective, Spinner } from './loading';
export { Page, type PageProps } from './page';
export { UserInfoCell } from './user-info-cell';

// 给文档用
export {
  VbenAvatar,
  VbenButton,
  VbenContextMenu,
  VbenCountToAnimator,
  VbenFullScreen,
  VbenIconButton,
  VbenLoading,
  VbenLogo,
  VbenSpinner,
} from '@/core/ui/adapter';

export {
  alert,
  Alert,
  type AlertProps,
  type BeforeCloseScope,
  clearAllAlerts,
  type CloseIconPlacement,
  confirm,
  type DrawerApiOptions,
  type DrawerPlacement,
  type DrawerProps,
  type DrawerState,
  type ExtendedDrawerApi,
  type ExtendedModalApi,
  type IconType,
  type ModalApiOptions,
  type ModalProps,
  type ModalState,
  prompt,
  type PromptProps,
  useAlertContext,
  useVbenDrawer,
  useVbenModal,
  VbenDrawer,
  VbenModal,
} from '@/core/ui/popup';
