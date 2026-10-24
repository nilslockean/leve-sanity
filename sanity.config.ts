import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemas'
import {svSELocale} from '@sanity/locale-sv-se'
import {visionTool} from '@sanity/vision'
import {dashboardTool} from '@sanity/dashboard'
import {OrderStatisticsWidget} from './components/orderStatisticsWidget'

export default defineConfig([
  {
    projectId: 'mz20cm4o',
    dataset: 'production',
    name: 'default',
    basePath: '/production',
    title: 'Bageri Leve',
    subtitle: 'production',
    plugins: [
      structureTool(),
      svSELocale(),
      visionTool(),
      dashboardTool({
        widgets: [
          {name: 'order-statistics', component: OrderStatisticsWidget, layout: {width: 'full'}},
        ],
      }),
    ],
    schema: {
      types: schemaTypes,
    },
  },
  {
    projectId: 'mz20cm4o',
    dataset: 'preview',
    name: 'staging-workspace',
    basePath: '/staging',
    title: '[TEST] Bageri Leve',
    subtitle: 'staging',
    plugins: [
      structureTool(),
      svSELocale(),
      visionTool(),
      dashboardTool({
        widgets: [
          {name: 'order-statistics', component: OrderStatisticsWidget, layout: {width: 'full'}},
        ],
      }),
    ],
    schema: {
      types: schemaTypes,
    },
  },
])
