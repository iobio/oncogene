<style scoped>
  .file-chooser-button {
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background-color: white !important;
    color: #717171 !important;
    height: 10px;
    font-size: 12px;
    font-weight: 500 !important;
    text-transform: none !important;
    margin-left: 0px;    display: inline-block;
  }
  .file-chooser-button .btn__content,
  .file-chooser-button .v-btn__content {
    font-size: 12px !important;
    font-weight: 500 !important;
    text-transform: none !important;
  }
  .file-chooser-button input[type=file] {
    position: absolute;
    top: 0;
    right: 0;
    min-width: 100%;
    min-height: 100%;
    font-size: 100px;
    text-align: right;
    filter: alpha(opacity=0);
    opacity: 0;
    outline: none;
    cursor: inherit;
    display: block;
  }

  #file-label-area {
    display: inline-block;
  }

  #file-label {
    display: inline-block;
  }

  #clear-file-button {
    color: #82b1ff;
    font-size: 12px;
    font-style: italic;
    margin: 0px;
    display: inline-block;
  }

</style>

<template>
  <span style="display:inline-block">
    <v-btn dark class="btn--dark-flat-focused file-chooser-button">
      {{ title }}
      <input v-if="isMultiple"  class="select-file" multiple type="file" @change="onFileSelected">
      <input v-if="!isMultiple" class="select-file" v-bind:accept="accept" type="file" @change="onFileSelected" >
    </v-btn>
    <div v-if="showLabel" id="file-label-area">
      <span id="file-label">
          {{ fileName }}
      </span>
      <v-btn small flat id="clear-file-button"
        @click="clearFile"
        v-if="fileName != null && fileName.length > 0">
          Clear
      </v-btn>
    </div>
  </span>
</template>


<script>
  export default {
    name: 'file-chooser',
    props: {
      isMultiple: null,
      showLabel: null,
      accept: null,
      selectedCallback: Function,
      title: String,
      disabled: () => {
        return false;
      }
    },
    data() {
      return {
        fileName: null
      }
    },
    methods: {
      onFileSelected: function(e) {
        const self = this;
        if (e.target.files[0]) {
          self.fileName = e.target.files[0].name;
          self.$emit("file-selected", e);
        } else {
          self.$emit("file-selected", null);
        }
      },
      clearFile: function() {
        const self = this;
        self._clearFileInput(self.$(".select-file")[0]);
        self.fileName = null;
      },
      _clearFileInput: function(ctrl) {
        try {
          ctrl.value = null;
        } catch(ex) {
          console.log("Clearing files exception");
        }
      }
    }

  }
</script>
