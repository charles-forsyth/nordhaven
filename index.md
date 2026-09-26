---
layout: page
title: "Tales from the Great Nordhaven Lodge"
permalink: /
description: "The chronicle of a high-ridge Appalachian homestead: Norse earth-faith, soil science, telemetry, and honest engineering."
---

# Nordhaven: The Lodge Chronicle
*Tales and truths from the Great Nordhaven Lodge, high on a northern Appalachian ridge*

> *"Here on the mountain ridge, the ancient forest meets the empirical wire. What the old Norse called the Landvaettir, the spirits of place, we honor with both sacred gratitude and exact measurement."*

Welcome to **Nordhaven**, the chronicle and field journal of a high-ridge homestead in the northern Appalachian plateau, about 1,600 feet up.

[**About the lodge &rarr;**]({{ site.baseurl }}/about/) &bull; [**Nordhaven Press: free books &rarr;**]({{ site.baseurl }}/press/) &bull; [**The archive &rarr;**]({{ site.baseurl }}/archive/) &bull; [**RSS**]({{ site.baseurl }}/feed.xml)

<div class="nh-feature" markdown="0">
<h2 id="harvest-moon-week">New from Nordhaven: The Harvest Moon Week</h2>
<p><em>Seven small books, written the week the Harvest Moon rose full over the ridge.</em> Each is set on one of the nights after the full moon, and each takes one lesson from an ordinary working week on the homestead and follows it back through the old stories: false scales and honest blanks, the edge of what a watcher can see, gates that swing against their neighbors, the winter larder, the keeper of the keys, the waning moon, and a small house on wheels that has to go back. Start with the prologue, or with whichever title calls to you.</p>
<ol class="nh-series">
{% assign hmw = site.posts | where: "series", "Harvest Moon Week" | sort: "series_part" %}
{% for post in hmw %}{% assign words = post.content | number_of_words %}
<li class="{% if post.series_part == 0 %}nh-prologue{% endif %}">
<span class="nh-part">{% if post.series_part == 0 %}Prologue{% else %}Book {{ post.series_part }}{% endif %}</span>
<a href="{{ post.url | relative_url }}"><strong>{{ post.title }}</strong></a>
<span class="nh-len">about {{ words | divided_by: 230 | plus: 1 }} min</span>
<br><span class="nh-desc">{{ post.description }}</span>
</li>
{% endfor %}
</ol>
</div>


Nordhaven is both a retreat and an empirical laboratory. It is where ancestral earth rhythms, seasonal Norse ceremonies, closed-loop soil microbiology, and modern edge telemetry come together into one way of life.

---

## What Is Nordhaven?

Nordhaven is a living, self-sufficient homestead run as a closed-loop ecological system. Rather than leaning on romantic folklore, it runs on empirical agroecology, continuous measurement, and plain self-reliance.

* **The Heritage Laying Flock:** A small pastured flock with predator-warded housing, deep-litter carbon bedding, and closed-loop nitrogen recycling.
* **The Living Soil and Three-Tea Organics:** High-aeration fabric pot cultivation fed by a three-tea protocol (aerated compost root drenches, living mycorrhizal inoculation, and foliar biostimulants). No synthetic pesticides or chemical fertilizers.
* **Spatial Telemetry and Ridge Microclimates:** A wireless mesh of sensors tracking barometric pressure, frost-pocket inversions, soil respiration, base-50 Growing Degree Days (GDD), and Vapor Pressure Deficit (VPD).
* **The Mechanical Fleet and Workshop:** Keeping the old iron running, from a work truck and its undercarriage rust-conversion chemistry to a small camper and a classic air-cooled car.
* **The Hearth and Companions:** A ridge cat who keeps his own hours, a woodstove, good home cooking, and the company of family and friends.

---

## Nordhaven Press

The lodge is also a working intellectual shop. Through its imprint, **Nordhaven Press**, it publishes free open-access field manuals and treatises bridging earth-faith, thermodynamics, and applied agronomy.

### Featured Releases
* **[The Web of Wyrd and Entropy]({{ site.baseurl }}/press/):** *Ancient Norse Cosmology, Thermodynamics, and the Science of the Living Homestead.*
* **[The Scientific Animist]({{ site.baseurl }}/press/):** *Honoring the Land Through Ritual, Sensor Networks, and Ecological Biophysics.*
* **[Of Soil and Solstice]({{ site.baseurl }}/press/):** *Where Ancient Earth Faith Meets Modern Physics on the Living Homestead.*
* **[Building a Farmstead for Science]({{ site.baseurl }}/press/):** *The 20-Chapter Agronomy and Engineering Field Manual.*

**[See the full Nordhaven Press library and download free PDFs &rarr;]({{ site.baseurl }}/press/)**

---

## Recent Field Dispatches

The ten newest entries. Everything else is in the **[archive]({{ site.baseurl }}/archive/)**, by month and by category.

<table>
  <thead>
    <tr>
      <th style="width: 15%;">Date</th>
      <th style="width: 45%;">Chronicle Dispatch</th>
      <th style="width: 25%;">Categories</th>
      <th style="width: 15%;">Link</th>
    </tr>
  </thead>
  <tbody>
    {% for post in site.posts limit:10 %}
    <tr>
      <td><strong>{{ post.date | date: "%b %d, %Y" }}</strong></td>
      <td>{{ post.title }}</td>
      <td><code>{{ post.categories | join: ", " }}</code></td>
      <td><a href="{{ post.url | relative_url }}">Read Dispatch &rarr;</a></td>
    </tr>
    {% endfor %}
  </tbody>
</table>

**[All {{ site.posts | size }} dispatches &rarr;]({{ site.baseurl }}/archive/)**

---

*"Between the bedrock and the sky, the wheel turns, and the land provides."*
