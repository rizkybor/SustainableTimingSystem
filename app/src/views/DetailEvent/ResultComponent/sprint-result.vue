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

    <b-table striped bordered hover :items="teams" :fields="fields">
      <template v-slot:cell(num)="data">
        {{ data.item.num }}
      </template>
      <template v-slot:cell(team)="data">
        {{ data.item.team }}
      </template>
      <template v-slot:cell(bib)="data">
        {{ data.item.bib }}
      </template>
      <template v-slot:cell(startTime)="data">
        {{ data.item.startTime }}
      </template>
      <template v-slot:cell(finishTime)="data">
        {{ data.item.finishTime }}
      </template>
      <template v-slot:cell(raceTime)="data">
        {{ data.item.raceTime }}
      </template>
      <template v-slot:cell(penalties)="data">
        {{ data.item.penalties }}
      </template>
      <template v-slot:cell(teamPenalties)="data">
        {{ data.item.teamPenalties }}
      </template>
      <template v-slot:cell(result)="data">
        {{ data.item.result }}
      </template>
      <template v-slot:cell(rank)="data">
        {{ data.item.rank }}
      </template>
      <template v-slot:cell(score)="data">
        {{ data.item.score }}
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
          num: 1,
          team: "JAMBI",
          bib: 5,
          startTime: "04:01:37,89",
          finishTime: "04:02:56,71",
          raceTime: "00:01:18,82",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:18,82",
          rank: 1,
          score: 100,
        },
        {
          num: 2,
          team: "SUMATERA SELATAN",
          bib: 7,
          startTime: "03:58:37,99",
          finishTime: "03:59:56,95",
          raceTime: "00:01:18,96",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:18,96",
          rank: 2,
          score: 92,
        },
        {
          num: 3,
          team: "SUMATERA BARAT",
          bib: 3,
          startTime: "03:49:38,74",
          finishTime: "03:50:58,87",
          raceTime: "00:01:20,13",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:20,13",
          rank: 3,
          score: 86,
        },
        {
          num: 4,
          team: "LAMPUNG",
          bib: 11,
          startTime: "03:52:38,74",
          finishTime: "03:53:59,70",
          raceTime: "00:01:20,97",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:20,97",
          rank: 4,
          score: 82,
        },
        {
          num: 5,
          team: "RIAU",
          bib: 1,
          startTime: "04:04:38,07",
          finishTime: "04:05:59,73",
          raceTime: "00:01:21,66",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:21,66",
          rank: 5,
          score: 79,
        },
        {
          num: 6,
          team: "BENGKULU",
          bib: 9,
          startTime: "03:55:37,87",
          finishTime: "03:57:05,62",
          raceTime: "00:01:27,75",
          penalties: 0,
          teamPenalties: "00:00:00,00",
          result: "00:01:27,75",
          rank: 6,
          score: 76,
        },
      ],
    };
  },
};
</script>

<style scoped>
/* Add your custom CSS styles here */
</style>
