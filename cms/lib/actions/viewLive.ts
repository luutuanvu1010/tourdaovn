import { resolveProductionUrl } from '../resolveProductionUrl'
import { LaunchIcon } from '@sanity/icons'
import type { DocumentActionComponent } from 'sanity'

export const ViewLiveAction: DocumentActionComponent = (props) => {
  const doc = props.published || props.draft
  if (!doc) return null
  if ((doc as { reviewStatus?: string }).reviewStatus !== 'approved') return null

  const url = resolveProductionUrl(doc as { _type: string; slug?: { vi?: { _type?: string; current?: string } } })
  if (!url) return null

  return {
    label: 'Xem trang live',
    icon: LaunchIcon,
    onHandle: () => {
      window.open(url, '_blank')
    },
  }
}
