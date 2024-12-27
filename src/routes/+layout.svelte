<script lang="ts">
  import ErrorToast from "../components/ErrorToast.svelte";
import Modal from "../components/Modal.svelte";
  import { modalStore } from "../components/modalStore";
  let { children } = $props();
</script>

{@render children?.()}
<Modal show={$modalStore.show} onClose={() => modalStore.close()}></Modal>
<ErrorToast/>
