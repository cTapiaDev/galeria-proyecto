<script setup>
import { ref, onMounted } from 'vue'
// 1. Importamos nuestro cliente de Supabase en lugar de axios
import { supabase } from './supabase'

// Las variables de estado siguen siendo las mismas
const images = ref([])
const newImageTitle = ref('')
const newImageFile = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// --- LÓGICA REFACTORIZADA CON SUPABASE ---

// 2. Función para obtener las imágenes
const fetchImages = async () => {
  try {
    // Usamos supabase.from('tabla').select('columnas').order('columna')
    const { data, error } = await supabase
      .from('images') // El nombre de tu tabla
      .select('*') // Selecciona todas las columnas
      .order('created_at', { ascending: false }) // Ordena por fecha de creación

    if (error) throw error
    images.value = data // Asignamos los datos recibidos
  } catch (error) {
    errorMessage.value = `Error al cargar imágenes: ${error.message}`
  }
}

// 3. Función para subir la imagen y guardar el registro
const handleSubmit = async () => {
  if (!newImageFile.value || !newImageTitle.value) {
    errorMessage.value = 'Por favor, selecciona un archivo y escribe un título.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // A. Subir el archivo al Storage de Supabase
    const file = newImageFile.value
    // Creamos un nombre de archivo único para evitar sobreescribir
    const filePath = `public/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('gallery-images') // El nombre de tu bucket
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // B. Obtener la URL pública del archivo que acabamos de subir
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(filePath)
    
    const publicUrl = urlData.publicUrl

    // C. Insertar el registro en la base de datos con el título y la URL
    const { error: insertError } = await supabase
      .from('images') // El nombre de tu tabla
      .insert({ 
        title: newImageTitle.value, 
        image_url: publicUrl 
      })

    if (insertError) throw insertError

    // D. Limpiar el formulario y recargar las imágenes
    newImageTitle.value = ''
    newImageFile.value = null
    document.querySelector('input[type="file"]').value = ''
    await fetchImages()

  } catch (error) {
    errorMessage.value = `Error al subir imagen: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

// El resto del script sigue igual
const handleFileChange = (event) => {
  newImageFile.value = event.target.files[0]
}

onMounted(fetchImages)
</script>

<template>
  <main class="container">
    <h1>Galería de Imágenes con Supabase</h1>
    <form @submit.prevent="handleSubmit" class="upload-form">
      <h2>Subir nueva imagen</h2>
      <input type="text" v-model="newImageTitle" placeholder="Título de la imagen" required />
      <input type="file" @change="handleFileChange" accept="image/*" required />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Subiendo...' : 'Subir Imagen' }}
      </button>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
    <div class="gallery">
      <div v-for="image in images" :key="image.id" class="gallery-item">
        <img :src="image.image_url" :alt="image.title" />
        <p>{{ image.title }}</p>
      </div>
    </div>
  </main>
</template>

<style>
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; font-family: sans-serif; }
  .upload-form { margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 8px; display: flex; flex-direction: column; gap: 1rem; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
  .gallery-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; }
  .error { color: red; }
</style>