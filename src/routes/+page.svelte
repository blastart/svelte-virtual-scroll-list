<script>
import {browser} from '$app/environment';
import App from "../examples/App.svelte";
import '../global.css';

</script>
{#if browser}
    <App />
{:else}
    <p>Loading...</p>
{/if}
