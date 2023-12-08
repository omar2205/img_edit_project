<script lang="ts">
  // @ts-nocheck
  import { onMount } from 'svelte'

  let isErasing = false
  let canvas
  let img
  let context
  let dialog
  let dialog_open = false
  $: if (dialog_open) dialog.show()

  let generated_img_url
  let err_msg

  let open_ai_input
  let prompt_input

  onMount(initialize)

  function initialize() {
    img = document.querySelector('#image')
    canvas = document.querySelector('#canvas')
    context = canvas.getContext('2d')

    img.onload = drawImage

    canvas.addEventListener('mousedown', startErasing)
    canvas.addEventListener('mousemove', doErase)
    canvas.addEventListener('mouseup', stopErasing)
    canvas.addEventListener('mouseout', stopErasing)
  }

  function drawImage() {
    context.drawImage(img, 0, 0, canvas.width, canvas.height)
  }

  function startErasing(event) {
    isErasing = true
    doErase(event)
  }

  function doErase(event) {
    if (isErasing) {
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height

      // Save the current context state
      context.save()

      // Set up a circular path for the eraser
      context.beginPath()
      context.arc(x, y, 5, 0, 2 * Math.PI) // Adjust the radius (5 in this case) as needed
      context.closePath()

      // Clip the context to the circular path
      context.clip()

      // Clear the content within the circular path
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Restore the context to its previous state (reset the clipping path)
      context.restore()
    }
  }

  function stopErasing() {
    isErasing = false
  }

  function resetCanvas() {
    drawImage()
  }

  function dataURLtoBlob(dataURL) {
    const base64String = dataURL.split(',')[1]
    const byteCharacters = atob(base64String)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: 'image/png' })
  }

  function sendImage() {
    // original image
    const original_image_data_url = canvas.toDataURL('image/png')
    const original_image_blob = dataURLtoBlob(original_image_data_url)

    canvas.toBlob(async (mask_blob) => {
      const fd = new FormData()
      fd.append('image', original_image_blob, 'image.png')
      fd.append('mask', mask_blob, 'mask.png')
      fd.append('model', 'dall-e-2')
      fd.append('prompt', prompt_input.value)

      const auth = `Bearer ${open_ai_input.value}`
      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: auth,
        },
        body: fd,
      })
        .then((r) => r.json())
        .catch((err) => (err_msg = 'Error generating image'))

      generated_img_url = res.data[0].url
      dialog_open = true
    })
  }
</script>

<div class="inputs">
  <md-outlined-text-field label="OpenAI KEY" bind:this={open_ai_input} />
  <md-outlined-text-field label="Prompt" bind:this={prompt_input} />
</div>

<nav>
  <md-outlined-button on:click={resetCanvas}>Reset</md-outlined-button>
  <md-filled-button on:click={sendImage}>Send</md-filled-button>
</nav>

<img id="image" src="/pre.png" alt="" />
<canvas id="canvas"></canvas>

<md-dialog
  bind:this={dialog}
  open={dialog_open}
  on:close={() => (dialog_open = false)}>
  <div slot="headline">Generated</div>
  <div slot="content">
    {#if err_msg}
      <p>{err_msg}</p>
    {:else}
      <img class="generated_img" src={generated_img_url} />
    {/if}
  </div>
</md-dialog>

<style>
  .inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  nav {
    margin: 1rem;
  }

  img {
    width: 128px;
    cursor: pointer;
  }

  .generated_img {
    width: 100%;
    aspect-ratio: 4/3;
  }

  canvas {
    width: 100%;
    height: 400px;
    outline: 1px solid blue;
    aspect-ratio: 4/3;
  }

  md-dialog {
    width: max(90vw, 360px);
    height: max(90vh, 500px);
  }
</style>
