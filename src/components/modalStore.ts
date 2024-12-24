import { writable } from 'svelte/store';

function createModalStore() {
  const { subscribe, set, update } = writable({
    show: false,
    component: null,
    props: {}
  });

  return {
    subscribe,
    open: (component: any, props = {}) => {
      set({ show: true, component, props });
    },
    close: () => {
      set({ show: false, component: null, props: {} });
    }
  };
}

export const modalStore = createModalStore();