<template>
  <div class="p-5">
    <h3 style="text-align: center">
      <span
        style="text-align: center; color: #ffffff; background-color: #99cc00"
        ><strong>{{ data.levelName }}</strong></span
      >
    </h3>
    <!-- <p>{{ data }}</p> -->
    <!-- <p>{{ dataParticipant }}</p> -->
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
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          {{ new Date().toLocaleDateString() }}</span
        ></strong
      >
    </p>
    <p style="text-align: center">
      <strong
        ><span style="color: #99cc00">{{ data.eventName }}</span></strong
      >
    </p>
    <p style="text-align: center">
      <strong
        ><span style="color: #99cc00"
          >Kp/Ds.{{ data.addressVillage }}, Kel.{{ data.addressDistrict }},
          Kec.{{ data.addressSubDistrict }}, Kota {{ data.addressCity }},
          {{ data.addressProvince }} - {{ data.addressState }} (
          {{ data.addressZipCode }} ) - {{ data.riverName }}</span
        ></strong
      >
    </p>

    <b-table
      striped
      bordered
      hover
      :items="dataParticipant"
      :fields="fields"
      :key="index"
      style="font-size: 8px"
    >
      <template v-slot:cell(num)="data">
        {{ data.index + 1 }}
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
        {{ data.item.result.finishTime }}
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
          >{{ data.raceDirector }}&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {{ data.chiefJudge }}</strong
        ></span
      >
    </p>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
    dataParticipant: Object,
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
        { key: "teamPenalties", label: "TIME PENALTIES" },
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
      dataScore: [
        {
          ranking: 1,
          score: 100,
        },
        {
          ranking: 2,
          score: 92,
        },
        {
          ranking: 3,
          score: 86,
        },
        {
          ranking: 4,
          score: 82,
        },
        {
          ranking: 5,
          score: 79,
        },
        {
          ranking: 6,
          score: 76,
        },
        {
          ranking: 7,
          score: 73,
        },
        {
          ranking: 8,
          score: 70,
        },
        {
          ranking: 9,
          score: 67,
        },
        {
          ranking: 10,
          score: 64,
        },
        {
          ranking: 11,
          score: 61,
        },
        {
          ranking: 12,
          score: 58,
        },
        {
          ranking: 13,
          score: 55,
        },
        {
          ranking: 14,
          score: 52,
        },
        {
          ranking: 15,
          score: 49,
        },
        {
          ranking: 16,
          score: 46,
        },
        {
          ranking: 17,
          score: 43,
        },
        {
          ranking: 18,
          score: 40,
        },
        {
          ranking: 19,
          score: 38,
        },
        {
          ranking: 20,
          score: 36,
        },
        {
          ranking: 21,
          score: 34,
        },
        {
          ranking: 22,
          score: 32,
        },
        {
          ranking: 23,
          score: 30,
        },
        {
          ranking: 24,
          score: 28,
        },
        {
          ranking: 25,
          score: 26,
        },
        {
          ranking: 26,
          score: 24,
        },
        {
          ranking: 27,
          score: 22,
        },
        {
          ranking: 28,
          score: 20,
        },
        {
          ranking: 29,
          score: 18,
        },
        {
          ranking: 30,
          score: 16,
        },
        {
          ranking: 31,
          score: 14,
        },
        {
          ranking: 32,
          score: 12,
        },
      ],
    };
  },
};
</script>

<style scoped>
/* Add your custom CSS styles here */
p {
  font-size: 12px;
}
</style>
