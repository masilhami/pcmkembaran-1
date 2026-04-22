import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { dashboardTool } from '@sanity/dashboard' 
import { schema } from './sanity/schemaTypes' // Pastikan path ini sesuai dengan struktur folder Anda

// Impor widget kustom
import InstallCountWidget from './sanity/widgets/InstallCountWidget'
import LatestInstallsWidget from './sanity/widgets/LatestInstallsWidget'
import TopArticlesWidget from './sanity/widgets/TopArticlesWidget'
import ProjectDetailsWidget from './sanity/widgets/ProjectDetailsWidget'

// Impor Ikon untuk estetika menu
import { CalendarIcon, HomeIcon, UsersIcon, PinIcon, ImagesIcon, DownloadIcon, DocumentsIcon } from '@sanity/icons'

export default defineConfig({
  name: 'default',
  title: 'PCM Kembaran Studio',

  // HARDCODED untuk membasmi error "Failed to extract manifest"
  projectId: 'deyoeizv', 
  dataset: 'production',
  basePath: '/studio', 

  plugins: [
    // 1. KONFIGURASI STRUKTUR MENU (Sidebar)
    structureTool({
      structure: (S) =>
        S.list()
          .title('Pusat Kendali Konten')
          .items([
            // Menu Berita & Artikel
            S.documentTypeListItem('post').title('Berita & Artikel').icon(DocumentsIcon),
            
            // MENU BARU: Jadwal Kajian & Tabligh Akbar
            S.documentTypeListItem('jadwalKajian').title('Jadwal Kajian & Tabligh').icon(CalendarIcon),
            
            S.divider(), // Garis pemisah

            // Menu Profil & Organisasi
            S.documentTypeListItem('profile').title('Profil Cabang').icon(HomeIcon),
            S.documentTypeListItem('pimpinan').title('Pimpinan Cabang (PCM)').icon(UsersIcon),
            
            S.divider(),
            
            // Menu Ranting & Fasilitas
            S.documentTypeListItem('ranting').title('Data Ranting (PRM)').icon(PinIcon),
            S.documentTypeListItem('masjid').title('Daftar Masjid').icon(PinIcon),
            
            S.divider(),
            
            // Menu Media & File
            S.documentTypeListItem('gallery').title('Galeri Foto').icon(ImagesIcon),
            S.documentTypeListItem('download').title('Manajemen Unduhan').icon(DownloadIcon),
            
            // Otomatis memunculkan tipe lain agar tidak ada yang tertinggal
            ...S.documentTypeListItems().filter(
              (listItem) => !['post', 'jadwalKajian', 'profile', 'pimpinan', 'ranting', 'masjid', 'gallery', 'download'].includes(listItem.getId() as string)
            ),
          ]),
    }),
    
    // 2. KONFIGURASI DASHBOARD WIDGETS
    dashboardTool({
      widgets: [
        {
          name: 'install-count',
          component: InstallCountWidget,
          layout: { width: 'small' } 
        },
        {
          name: 'top-articles',
          component: TopArticlesWidget,
          layout: { width: 'medium' } 
        },
        {
          name: 'latest-installs',
          component: LatestInstallsWidget,
          layout: { width: 'full' } 
        },
        {
          name: 'project-details',
          component: ProjectDetailsWidget,
          layout: { width: 'full' }
        }
      ]
    })
  ],

  schema: {
    // Pastikan ini merujuk ke schemaTypes/index.ts yang sudah kita update tadi
    types: schema.types,
  },
})