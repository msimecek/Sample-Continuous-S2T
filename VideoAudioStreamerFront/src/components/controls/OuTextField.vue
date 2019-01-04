<template>
  <div class='ms-TextField' ref='textField' :class='textFieldClass'>
    <label class='ms-Label'>{{ label }}</label>
    <textarea
      v-if="type == 'multiline'"
      :placeholder='placeholder'
      class='ms-TextField-field'
      type='text'
      :value='value'
      @input='updateValue'
      @change='changeEvent'
      :disabled='disabled'></textarea>
    <input
      v-else
      :placeholder='placeholder'
      class='ms-TextField-field'
      :type='inputType'
      :value='value'
      @input='updateValue'
      @change='changeEvent'
      :disabled='disabled' />
  </div>
</template>
<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class OuTextField extends Vue {
    @Prop() type!: string;
    @Prop() disabled!: boolean;
    @Prop() value!: string;
    @Prop() label!: string;
    @Prop() placeholder!: string;
    @Prop({ 
        default: "text", 
        validator(value) { 
            return ['text', 'password', 'file'].includes(value);
        }
    }) inputType!: string;

    get textFieldClass(): any {
        return {
          [`ms-TextField--${this.type}`]: !!this.type,
          'is-disabled': this.disabled
        };
    }

    updateValue(event: any) {
        this.$emit('input', event.target.value);
    }

    changeEvent(event: any) {
        this.$emit('change', event.target.value);
    }
}
</script>