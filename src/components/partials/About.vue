<template>
  <v-card>
    <v-toolbar
        dark
        color="primary">
      <v-btn
          icon
          dark
          @click="$emit('exit-about')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <v-toolbar-title class="dialog-title">ONCOGENE.IOBIO</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-navigation-drawer permanent absolute
                         :style="{ marginTop: toolbarHeight + 'px', transform: 'translateX(0) !important', visibility: 'visible !important' }"
                         :height="height - 64" :width="navDrawerWidth">
      <v-list
          nav
      >
        <v-list-item-group v-model="selectedItem" color="primary">
          <v-list-item
              v-for="item in items"
              :key="item.title"
              link
          >
            <v-list-item-icon>
              <v-icon color="primary">{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="about-nav-header">{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-main :style="{ marginLeft: navDrawerWidth + 'px', marginTop: '-' + toolbarHeight + 'px' }">
      <v-container class="fill-height" fluid>
        <v-row class="fill-height">
          <v-col>
            <transition name="fade">
              <AboutText v-if="selectedItem === 0"></AboutText>
              <InputText v-else-if="selectedItem === 1"></InputText>
              <RankingText v-else-if="selectedItem === 2"></RankingText>
              <VisualText v-else-if="selectedItem === 3"></VisualText>
              <FilteringText v-else-if="selectedItem === 4"></FilteringText>
            </transition>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-card>
</template>

<script>
import AboutText from "@/components/about/AboutText.vue";
import InputText from "@/components/about/InputText";
import RankingText from "@/components/about/RankingText";
import VisualText from "@/components/about/VisualText";
import FilteringText from "@/components/about/FilteringText";
export default {
  name: "About.vue",
  components: {
    AboutText,
    InputText,
    RankingText,
    VisualText,
    FilteringText
  },
  props: {
    height: {
      type: Number,
      default: 500
    }
  },
  data: () => {
    return {
      navDrawerWidth: 350,
      toolbarHeight: 64,
      selectedItem: 0,
      items: [
        {title: 'About', icon: 'info'},
        {title: 'Data Inputs & Format', icon: 'description'},
        {title: 'Gene Scoring & Ranking', icon: 'line_weight'},
        {title: 'Visual Elements', icon: 'auto_awesome'},
        {title: 'Filtering', icon: 'filter_alt'}
      ]
    }
  },
}
</script>

<style scoped lang="sass">
.about-nav-title
  font-family: Open Sans
  font-size: 24px
  color: rgba(0, 0, 0, 0.6)

.about-nav-header
  font-family: Open Sans
  font-size: 16px
  color: rgba(0, 0, 0, 0.6)

.dialog-title
  font-family: Quicksand
  color: white
  font-weight: 500
  font-size: 22px

</style>