---
layout: pois
title: POIs List
permalink: /pois/

---
<script>
  var pois = []
{% for p in site.pois %}
  pois.push({ id:  '{{p.wikidatum}}', url: '{{ p.url | relative_url}}', title: '{{ p.title }}' })
{% endfor %}
</script>

