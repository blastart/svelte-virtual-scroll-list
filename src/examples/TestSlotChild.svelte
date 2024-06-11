<script>
  /**
   * @type {import('../lib/index').TypeSlotData | undefined | null}
   */
  export let slotData = null
  export let nameOfSlot = 'testSlotChild'

  $: {
    console.log(`SlotChildTest.svelte: ${nameOfSlot} updated with this slotData`, slotData)
  }
</script>