<template>
  <button class='ms-Button' :class='buttonClass' @click='clickEvent'>
    <span class='ms-Button-icon' v-if="icon && type == 'hero'">
      <i class='ms-Icon' :class='iconClass'></i>
    </span>
    <span class='ms-Button-label'><slot /></span>
    <span class='ms-Button-description' v-if="description && type == 'compound'">
      {{ description }}
    </span>
  </button>
</template>
<script lang="ts">
  
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class OuButton extends Vue {
    @Prop() description!: string;
    @Prop() disabled!: boolean;
    @Prop() icon!: String;
    @Prop() type!: String;

    get buttonClass(): any {
        return {
          [`ms-Button--${this.type}`]: !!this.type,
          'is-disabled': this.disabled
        };
    }

    get iconClass(): any {
        return {
            [`ms-Icon--${this.icon}`]: !!this.icon
        };
    }

    clickEvent() {
        if (!this.disabled) { this.$emit('click'); }
    }  
}
</script>