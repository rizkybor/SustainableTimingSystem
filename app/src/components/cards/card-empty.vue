<template>
  <div>
    <b-card class="shadow" style="border-radius: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between">
          <div class="mx-2 mt-3">
            <p class="h5 font-weight-bold">{{ teamTitle }}</p>
          </div>
          <!-- <b-button
            style="border-radius: 20px"
            class="btn-md"
            variant="primary"
            @click="$emit('open-modal')"
          >
            <Icon icon="ic:baseline-add-circle" /> New Team
          </b-button> -->
        </div>
      </template>
      <div class="text-center my-5"> 
          <h3 class="font-weight-bold">There are no teams registered for this event yet</h3>
      </div>
    </b-card>
  </div>
</template>

<script>
export default {
  name: 'SustainableTimingSystemRaftingCardEmpty',

  data() {
    return {
      
    };
  },

  mounted() {
    
  },

  methods: {
    
  },
};
</script>