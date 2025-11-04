---
layout: pois
permalink: /pois/
title: Χάρτης Κάστρων
description: Εξερεύνησε τα κάστρα και τα μεσαιωνικά φρούρια της Ελλάδας πάνω σε διαδραστικό χάρτη
---
<script>
  var pois = []
{% for p in site.pois %}
  pois.push({ id:  '{{p.wikidatum}}', url: '{{ p.url | relative_url}}', title: '{{ p.title }}' })
{% endfor %}
</script>

