<script>
import '../app.css';

let { children } = $props();
</script>

<div class="container">
  <header>
    <h1><a href="/">Doughboys</a></h1>
    <p>Browse episodes and find restaurants near you</p>
  </header>

  {@render children()}
</div>
