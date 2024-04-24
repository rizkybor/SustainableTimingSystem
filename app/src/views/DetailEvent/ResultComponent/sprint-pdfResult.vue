<template>
  <div>
    <h3 style="text-align: center">
      <span
        style="text-align: center; color: #ffffff; background-color: #99cc00"
        ><strong>NASIONAL RAFTING CHAMPIONSIP/ IRF Level E</strong></span
      >
    </h3>
    <p style="text-align: center">&nbsp;</p>
    <p style="text-align: center">
      <strong
        ><span style="background-color: #99cc00; color: #ffffff"
          >SCORE BOARD&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;OPEN
          WOMEN</span
        ></strong
      >
    </p>
    <p style="text-align: center">
      <strong
        ><span style="background-color: #99cc00; color: #ffffff"
          >SPRINT RESULT&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 22-Agus-2023</span
        ></strong
      >
    </p>
    <p style="text-align: center">
      <strong
        ><span style="color: #99cc00"
          >BABAK KUALIFIKASI PON XXI ACEH-SUMUT TAHUN 2024</span
        ></strong
      >
    </p>
    <p style="text-align: center">
      <strong
        ><span style="color: #99cc00"
          >SUNGAI BATANG ANAI, PADANG PARIAMAN, SUMATERA BARAT</span
        ></strong
      >
    </p>

    <b-table striped bordered hover :items="teams" :fields="fields" :key="index">
      <template v-slot:cell(num)="data">
        {{ data.index+1 }}
      </template>
      <template v-slot:cell(team)="data">
        {{ data.item.nameTeam }}
      </template>
      <template v-slot:cell(bib)="data">
        {{ data.item.bibTeam }}
      </template>
      <template v-slot:cell(startTime)="data">
        {{ data.item.result.startTime }}
      </template>
      <template v-slot:cell(finishTime)="data">
        {{ data.item.result.startFinish }}
      </template>
      <template v-slot:cell(raceTime)="data">
        {{ data.item.result.raceTime }}
      </template>
      <template v-slot:cell(penalties)="data">
        {{ data.item.result.penalty }}
      </template>
      <template v-slot:cell(teamPenalties)="data">
        {{ data.item.result.penaltyTime }}
      </template>
      <template v-slot:cell(result)="data">
        {{ data.item.result.totalTime }}
      </template>
      <template v-slot:cell(rank)="data">
        {{ data.item.result.ranked }}
      </template>
      <template v-slot:cell(score)="data">
        {{ data.item.result.score }}
      </template>
    </b-table>

    <p>
      <span style="color: #99cc00"
        ><strong
          >Race Director Name&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Cief Judge (1st Jury
          Name)</strong
        ></span
      >
    </p>
    <p>&nbsp;</p>
    <p>
      <span style="color: #99cc00"
        ><strong
          >Adi Ruswin&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; Ismed Ramdhan</strong
        ></span
      >
    </p>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
  },
  data() {
    return {
      fields: [
        { key: "num", label: "Num" },
        { key: "team", label: "TEAM" },
        { key: "bib", label: "BIB" },
        { key: "startTime", label: "START TIME" },
        { key: "finishTime", label: "FINISH TIME" },
        { key: "raceTime", label: "RACE TIME" },
        { key: "penalties", label: "PENALTIES" },
        { key: "teamPenalties", label: "TIM PENALTIES" },
        { key: "result", label: "RESULT" },
        { key: "rank", label: "RANK" },
        { key: "score", label: "SCORE" },
      ],
      teams: [
        {
          nameTeam: "gg",
          bibTeam: "7",
          startOrder: "",
          praStart: "",
          intervalRace: "",
          result: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
        },
        {
          nameTeam: "gg",
          bibTeam: "7",
          startOrder: "",
          praStart: "",
          intervalRace: "",
          result: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
        },
        {
          nameTeam: "gg",
          bibTeam: "7",
          startOrder: "",
          praStart: "",
          intervalRace: "",
          result: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
        },
      ],
    };
  },
};
</script>

<style scoped>
/* Add your custom CSS styles here */
</style>
