<template>
  <div class="search-multiselect">
    <div class="selected-chips mb-2" v-if="selectedLabels.length">
      <span class="badge bg-secondary me-1" v-for="s in selectedLabels" :key="s">{{ s }}</span>
    </div>

    <input type="text" class="form-control mb-2" v-model="q" :placeholder="placeholder" />

    <div class="list border rounded" :style="{ maxHeight: (size*36)+'px', overflowY: 'auto' }">
      <div class="list-item d-flex align-items-center p-2" v-for="item in filtered" :key="item[idKey]">
        <input class="form-check-input me-2" type="checkbox" :id="item[idKey]" :value="item[idKey]" :checked="isSelected(item[idKey])" @change="toggle(item[idKey])" />
        <label class="mb-0" :for="item[idKey]">{{ item[labelKey] }}</label>
      </div>
      <div class="p-2 text-muted" v-if="filtered.length===0">Aucun résultat</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Rechercher...' },
  labelKey: { type: String, default: 'label' },
  idKey: { type: String, default: 'id' },
  size: { type: Number, default: 6 }
})
const emit = defineEmits(['update:modelValue'])

const q = ref('')
const selected = ref([...props.modelValue])

watch(() => props.modelValue, v => { selected.value = Array.isArray(v) ? [...v] : [] })

const filtered = computed(() => {
  const term = (q.value || '').toLowerCase()
  if (!term) return props.items
  return props.items.filter(i => String(i[props.labelKey] || '').toLowerCase().includes(term) || String(i[props.idKey] || '').toLowerCase().includes(term))
})

function isSelected(id) { return selected.value.indexOf(id) !== -1 }
function toggle(id){
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx,1)
  emit('update:modelValue', [...selected.value])
}

const selectedLabels = computed(() => {
  return selected.value.map(id => {
    const it = props.items.find(i => i[props.idKey] === id)
    return it ? it[props.labelKey] : id
  })
})
</script>

<style scoped>
.list-item { cursor: pointer }
.selected-chips .badge { font-size: 0.85rem }
</style>
