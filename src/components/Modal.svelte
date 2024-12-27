<script lang="ts">
  import { fade } from 'svelte/transition';
  import { modalStore } from './modalStore';
  let {show, onClose}=$props();
</script>

{#if show}
  
  <div class="modal-overlay" transition:fade on:click={onClose}>
    <div class="modal" on:click|stopPropagation>

      {@render $modalStore.component?.()}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
</style>