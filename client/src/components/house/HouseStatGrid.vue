<script setup lang="ts">
import type { Component } from "vue";
import { Card, CardContent } from "@/components/ui/card";

const props = defineProps<{
  items: readonly {
    label: string;
    value: string;
    cls?: string;
  }[];
  icons: readonly Component[];
  iconClasses: readonly string[];
}>();
</script>

<template>
  <div class="house-stat-grid grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      v-for="(item, index) in props.items"
      :key="item.label"
      class="house-stat-card border-border/50 bg-muted/30"
    >
      <CardContent class="house-stat-card-content">
        <div class="house-stat-heading">
          <span class="house-stat-icon" :class="props.iconClasses[index]">
            <component
              :is="props.icons[index]"
              aria-hidden="true"
              class="h-3.5 w-3.5"
            />
          </span>
          <p class="house-stat-label">{{ item.label }}</p>
        </div>
        <p class="house-stat-value" :class="item.cls">{{ item.value }}</p>
      </CardContent>
    </Card>
  </div>
</template>
