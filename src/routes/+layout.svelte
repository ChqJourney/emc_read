<script lang="ts">
    import Modal from '../components/Modal.svelte';
    import { modalStore } from '../components/modalStore';
  </script>
  
  <slot />
  
  <Modal show={$modalStore.show} onClose={() => modalStore.close()}>
    {#if $modalStore.component}
      <svelte:component this={$modalStore.component} {...$modalStore.props} />
    {/if}
  </Modal>