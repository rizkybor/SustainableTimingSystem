<template>
  <div class="hello">
    <h1 style="font-weight: 800;">{{ msg }}</h1>
    <!-- <b-button @click="helo()" variant="danger"><Icon icon="ic:baseline-add-circle" />Create New Event</b-button> -->
    
  </div>
</template>

<script>

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  methods: {
   
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
} */
</style>
