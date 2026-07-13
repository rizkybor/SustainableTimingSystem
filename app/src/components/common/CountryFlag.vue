<template>
  <img
    v-if="flagSrc"
    :src="flagSrc"
    :title="countryName"
    :alt="countryName || code"
    class="country-flag"
  />
</template>

<script>
import { getCountryName } from "@/utils/countries";

export default {
  name: "CountryFlag",
  props: {
    code: { type: String, default: "" },
  },
  computed: {
    flagSrc() {
      if (!this.code) return "";
      try {
        return require(`flag-icons/flags/4x3/${this.code.toLowerCase()}.svg`);
      } catch (e) {
        return "";
      }
    },
    countryName() {
      return getCountryName(this.code);
    },
  },
};
</script>

<style scoped>
.country-flag {
  display: inline-block;
  width: 1.2em;
  height: 0.9em;
  object-fit: cover;
  border-radius: 2px;
  vertical-align: middle;
  margin-left: 6px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}
</style>
