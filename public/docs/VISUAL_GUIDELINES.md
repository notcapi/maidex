# Guía de Estilo Visual - Maidex

Este documento establece las directrices de diseño para mantener una experiencia de usuario coherente y unificada en toda la aplicación Maidex.

## Tokens de Diseño

### Colores

Maidex utiliza un sistema de colores basado en tokens HSL definidos en la raíz del proyecto. Estos son los principales tokens de color:

```css
:root {
  /* Colores base */
  --background: 0 0% 100%;       /* Fondo de la aplicación */
  --foreground: 0 0% 3.9%;       /* Texto principal */
  
  /* Elementos de UI */
  --card: 0 0% 100%;             /* Fondo de tarjetas */
  --card-foreground: 0 0% 3.9%;  /* Texto en tarjetas */
  --popover: 0 0% 100%;          /* Fondo de popovers */
  --popover-foreground: 0 0% 3.9%; /* Texto en popovers */
  
  /* Tokens de marca */
  --primary: 221 83% 53%;        /* Color principal de la marca */
  --primary-foreground: 0 0% 98%; /* Texto sobre color principal */
  
  /* Tokens secundarios */
  --secondary: 240 4.8% 95.9%;   /* Color secundario */
  --secondary-foreground: 240 5.9% 10%; /* Texto sobre secundario */
  --muted: 240 4.8% 95.9%;       /* Áreas sutiles */
  --muted-foreground: 240 3.8% 46.1%; /* Texto menos importante */
  --accent: 240 4.8% 95.9%;      /* Para énfasis */
  --accent-foreground: 240 5.9% 10%; /* Texto sobre acento */
  
  /* Feedback */
  --destructive: 0 84.2% 60.2%;  /* Errores, alertas */
  --destructive-foreground: 0 0% 98%; /* Texto sobre destructivo */
  
  /* Utilitarios */
  --border: 240 5.9% 90%;        /* Bordes */
  --input: 240 5.9% 90%;         /* Bordes de inputs */
  --ring: 221 83% 53%;           /* Outline de focus */
  
  /* Gráficos */
  --chart-1: 12 76% 61%;         /* Colores para gráficas */
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  
  /* Radio */
  --radius: 0.5rem;              /* Bordes redondeados */
}
```

En modo oscuro, estos valores se ajustan automáticamente mediante la clase `.dark`.

### Espaciado

El sistema de espaciado sigue un patrón consistente:

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Tipografía

La aplicación utiliza una jerarquía tipográfica clara:

- **Familia de fuentes**: Inter (sans-serif)
- **Tamaños de fuente**:
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)
  - 4xl: 2.25rem (36px)

## Componentes Principales

### Botones

Los botones siguen estas variantes:

1. **Default**: Fondo primario con texto claro
2. **Secondary**: Fondo sutil con texto más oscuro
3. **Outline**: Bordes visibles sin relleno
4. **Ghost**: Sin bordes ni fondo visible hasta hover
5. **Destructive**: Para acciones peligrosas (rojo)
6. **Link**: Apariencia de enlace

Tamaños: `sm`, `md` (default), `lg` y `icon` para botones de icono.

### Tarjetas

Las tarjetas (`Card`) son contenedores con bordes sutiles y sombras ligeras que organizan el contenido. Incluyen:

- `CardHeader`: Encabezado con título y descripción
- `CardTitle`: Título principal
- `CardDescription`: Texto descriptivo
- `CardContent`: Contenido principal
- `CardFooter`: Pie con acciones

### Inputs y Campos

Los campos de formulario mantienen un estilo coherente:

- Bordes sutiles que se destacan al enfocar
- Estados claros: normal, focus, error, disabled
- Etiquetas alineadas y consistentes
- Mensajes de error en color destructivo

### Navegación

Los elementos de navegación siguen estas reglas:

1. Usar `NavigationMenu` para menús principales
2. Aplicar estado `active` para marcar la página actual
3. Mostrar indicadores claros en hover y focus
4. Adaptar navegación para diferentes tamaños de pantalla

## Principios de Diseño

### 1. Consistencia Visual

- Usar los mismos tokens de color y espaciado en toda la UI
- Mantener patrones de interacción similares entre componentes
- Asegurar que elementos similares tengan apariencia y comportamiento similar

### 2. Jerarquía Clara

- Establecer relaciones claras entre elementos mediante tamaño, peso y color
- Guiar la atención del usuario hacia la información más importante
- Usar espaciado y agrupación para establecer relaciones visuales

### 3. Feedback Claro

- Proporcionar retroalimentación visual para todas las interacciones
- Usar animaciones sutiles para transiciones
- Comunicar estados y errores de forma clara y accesible

### 4. Accesibilidad

- Mantener suficiente contraste entre texto y fondo (AA WCAG)
- Asegurar que la interfaz sea navegable por teclado
- Incluir textos alternativos para contenido no textual

### 5. Diseño Responsive

- Adaptar layouts para diferentes tamaños de pantalla
- Priorizar contenido importante en dispositivos móviles
- Asegurar que los elementos táctiles tengan tamaño suficiente (mínimo 44x44px)

## Ejemplos de Implementación

### Ejemplo: Botones

```tsx
// Botón primario
<Button>Acción Principal</Button>

// Botón secundario
<Button variant="secondary">Acción Secundaria</Button>

// Botón outline
<Button variant="outline">Acción Terciaria</Button>

// Botón de icono
<Button size="icon" variant="ghost">
  <PlusIcon className="h-4 w-4" />
</Button>
```

### Ejemplo: Tarjeta

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título de la Tarjeta</CardTitle>
    <CardDescription>Descripción breve del contenido</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenido principal de la tarjeta...</p>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="ghost">Cancelar</Button>
    <Button>Guardar</Button>
  </CardFooter>
</Card>
```

### Ejemplo: Formulario

```tsx
<form>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" placeholder="Email" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Contraseña</Label>
      <Input id="password" type="password" />
    </div>
    <Button type="submit" className="w-full">
      Iniciar Sesión
    </Button>
  </div>
</form>
```

## Recursos Adicionales

- [Componentes ShadcnUI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion para animaciones](https://www.framer.com/motion/) 